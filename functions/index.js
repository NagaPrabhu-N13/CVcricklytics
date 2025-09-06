// const functions = require('firebase-functions');
const functions = require("firebase-functions");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, updateDoc, doc } = require("firebase-admin/firestore"); 
const { getStorage } = require("firebase-admin/storage");
const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");
const path = require("path");
const util = require("util");
const crypto = require("crypto");
const Razorpay = require('razorpay');
const log = require("./logger");
const os = require('os');
const { promisify } = require('util');


initializeApp();
const db = getFirestore();
const storage = getStorage();
const client = new textToSpeech.TextToSpeechClient();
const razorpay = new Razorpay({ key_id: 'rzp_test_cJbmy9En8XJvPv', key_secret: '6R5F7B44V1lmv3q5FS5UKLDe' });

// Helper function to generate audio and return URL
async function generateAndUploadAudio(player, playerId) {
  const battingAvgAfter = player.careerStats?.batting?.average ?? 0;
  const bowlingAvgAfter = player.careerStats?.bowling?.average ?? 0;
  const highestScoreAfter = player.careerStats?.batting?.runs ?? 0;

  const text = `${player.name}, a ${player.age ?? ''}-year-old ${player.role} from the ${player.teamName ?? ''}.
${player.name} is a ${player.battingStyle ?? ''}, with a batting average of ${battingAvgAfter}, a bowling average of ${bowlingAvgAfter}, and a highest score of ${highestScoreAfter}.`;

  const request = {
    input: { text },
    voice: { languageCode: 'en-IN', ssmlGender: 'MALE', name: 'en-IN-Wavenet-C' },
    audioConfig: { audioEncoding: 'MP3' }
  };

  let tempFilePath;
  try {
    const [response] = await client.synthesizeSpeech(request);
    tempFilePath = path.join(os.tmpdir(), `${playerId}.mp3`);
    await util.promisify(fs.writeFile)(tempFilePath, response.audioContent, 'binary');

    const destination = `player_audio/${playerId}.mp3`;
    await storage.bucket().upload(tempFilePath, { destination });

    const audioUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.bucket().name}/o/${encodeURIComponent(destination)}?alt=media`;

    // Clean up temp file if it exists
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return audioUrl;
  } catch (error) {
    console.error('Error generating/uploading audio:', error);
    // Clean up temp file if it was created
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    throw error;
  }
}

// Trigger on new player creation
exports.generatePlayerAudioOnCreate = onDocumentCreated("PlayerDetails/{playerId}", async (event) => {
  const playerId = event.params.playerId;
  const data = event.data.data();

  try {
    const audioUrl = await generateAndUploadAudio(data, playerId);
    await event.data.after.ref.update({ audioUrl });
    console.log(`Audio generated on create for player ${playerId}`);
  } catch (error) {
    console.error(`Failed to generate audio on create for player ${playerId}:`, error);
  }
});

// Trigger on player update
exports.generatePlayerAudioOnUpdate = onDocumentUpdated("PlayerDetails/{playerId}", async (event) => {
  const playerId = event.params.playerId;
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();

  if (JSON.stringify(beforeData.careerStats) === JSON.stringify(afterData.careerStats)) {
    console.log('No change in careerStats, skipping audio generation.');
    return;
  }

  try {
    const audioUrl = await generateAndUploadAudio(afterData, playerId);
    await event.data.after.ref.update({ audioUrl });
    console.log(`Audio regenerated on update for player ${playerId}`);
  } catch (error) {
    console.error(`Failed to regenerate audio on update for player ${playerId}:`, error);
  }
});

// One-time backfill function for existing players without audioUrl (trigger via HTTP request)
exports.backfillPlayerAudio = functions.https.onRequest(async (req, res) => {
  try {
    const snapshot = await db.collection('PlayerDetails').get();
    const promises = snapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      const playerId = docSnapshot.id;

      if (!data.audioUrl) {
        try {
          const audioUrl = await generateAndUploadAudio(data, playerId);
          await docSnapshot.ref.update({ audioUrl });
          console.log(`Backfilled audio for player ${playerId}`);
        } catch (error) {
          console.error(`Failed to backfill audio for player ${playerId}:`, error);
        }
      } else {
        console.log(`Audio already exists for player ${playerId}, skipping.`);
      }
    });

    await Promise.all(promises);
    res.status(200).send('Backfill completed successfully.');
  } catch (error) {
    console.error('Error during backfill:', error);
    res.status(500).send('Backfill failed.');
  }
});
// ✅ 1. Generate Player Details Audio
exports.generatePlayerDetailsAudio = onDocumentCreated("players/{playerId}", async (event) => {
    const snap = event.data;
    if (!snap) {
        log("❌ No snapshot data received.");
        return;
    }

    const playerData = snap.data();
    const playerId = event.params.playerId;

    log("📌 New player added", playerId);

    const text = `${playerData.name}, a ${playerData.role} from ${playerData.team}, 
has a batting average of ${playerData.battingAvg} and a bowling average of ${playerData.bowlingAvg || "not available"}.
Recent scores are ${playerData.recentMatches.join(", ")}.`;

    log("📝 Generated Text", text);

    const request = {
        input: { text },
        voice: {
            languageCode: "en-IN",
            ssmlGender: "MALE",
            name: "en-IN-Wavenet-C",
        },
        audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
            pitch: 0.0,
            volumeGainDb: 0.0,
            effectsProfileId: ["handset-class-device"],
        },
    };

    try {
        const [response] = await client.synthesizeSpeech(request);
        const fileName = `player_files/${playerId}.mp3`;
        const tempFilePath = path.join("/tmp", `${playerId}.mp3`);

        await util.promisify(fs.writeFile)(tempFilePath, response.audioContent, "binary");
        log("💾 Audio file saved locally", tempFilePath);

        await storage.bucket().upload(tempFilePath, {
            destination: fileName,
            metadata: { contentType: "audio/mpeg" },
        });
        log("🚀 Audio file uploaded to Firebase Storage", fileName);

        const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.bucket().name}/o/${encodeURIComponent(fileName)}?alt=media`;

        await db.collection("players").doc(playerId).update({ audioUrl: fileUrl });
        log("✅ Audio URL updated in Firestore", fileUrl);
    } catch (error) {
        log("❌ Error generating/storing AI voice", error.message);
    }
});

// ✅ 2. Generate Welcome Audio
exports.generateWelcomeAudio = onDocumentCreated("users/{userId}", async (event) => {
    const snap = event.data;
    if (!snap) {
        log("❌ No user snapshot data.");
        return;
    }

    const userData = snap.data();
    const userId = event.params.userId;

    const userName = userData.firstName || "User";
    const welcomeText = `Welcome to Cricklytics! ${userName}`;

    log("📌 New user added", userId);
    log("📝 Welcome text", welcomeText);

    const request = {
        input: { text: welcomeText },
        voice: {
            languageCode: "en-IN",
            ssmlGender: "MALE",
            name: "en-IN-Wavenet-C",
        },
        audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
            pitch: 0.0,
            volumeGainDb: 0.0,
            effectsProfileId: ["handset-class-device"],
        },
    };

    try {
        const [response] = await client.synthesizeSpeech(request);
        const fileName = `welcome_audio/${userId}.mp3`;
        const tempFilePath = path.join("/tmp", `${userId}_welcome.mp3`);

        await util.promisify(fs.writeFile)(tempFilePath, response.audioContent, "binary");
        log("💾 Welcome audio saved locally", tempFilePath);

        await storage.bucket().upload(tempFilePath, {
            destination: fileName,
            metadata: { contentType: "audio/mpeg" },
        });
        log("🚀 Welcome audio uploaded to Firebase Storage", fileName);

        const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.bucket().name}/o/${encodeURIComponent(fileName)}?alt=media`;

        await db.collection("users").doc(userId).update({ welcomeAudio: fileUrl });
        log("✅ Welcome audio URL updated in Firestore", fileUrl);
    } catch (err) {
        log("❌ Failed to generate welcome audio", err.message);
    }
});

// ✅ 3. Generate AI Assistance Audio
exports.generateAiAssistanceAudio = onDocumentCreated("ai_assistance/{aiId}", async (event) => {
    const snap = event.data;
    if (!snap) {
        log("❌ No AI snapshot data received.");
        return;
    }

    const aiData = snap.data();
    const aiId = event.params.aiId;

    const text = aiData.context;
    if (!text || text.trim().length === 0) {
        log("⚠️ No context text provided.");
        return;
    }

    const request = {
        input: { text },
        voice: {
            languageCode: "en-IN",
            ssmlGender: "MALE",
            name: "en-IN-Wavenet-C",
        },
        audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
            pitch: 0.0,
            volumeGainDb: 0.0,
            effectsProfileId: ["handset-class-device"],
        },
    };

    try {
        const [response] = await client.synthesizeSpeech(request);
        const fileName = `ai_audio/${aiId}.mp3`;
        const tempFilePath = path.join("/tmp", `${aiId}.mp3`);

        await util.promisify(fs.writeFile)(tempFilePath, response.audioContent, "binary");
        log("💾 AI audio saved locally", tempFilePath);

        await storage.bucket().upload(tempFilePath, {
            destination: fileName,
            metadata: { contentType: "audio/mpeg" },
        });
        log("🚀 AI audio uploaded to Firebase Storage", fileName);

        const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.bucket().name}/o/${encodeURIComponent(fileName)}?alt=media`;

        await db.collection("ai_assistance").doc(aiId).update({ audioUrl: fileUrl });
        log("✅ AI audio URL updated in Firestore", fileUrl);
    } catch (error) {
        log("❌ Error generating/storing AI voice", error.message);
    }
});

// ✅ 4. Generate and Update Club Player Audio
exports.generateClubPlayerDetailsAudio = onDocumentCreated("clubTeams/{clubTeamId}", async (event) => {
    const snap = event.data;
    if (!snap) {
        log("❌ No snapshot data received for club team.");
        return;
    }

    const clubTeamData = snap.data();
    const clubTeamId = event.params.clubTeamId;
    const players = clubTeamData.players || [];

    log("📌 New club team added:", clubTeamId);

    for (const player of players) {
        const playerId = player.playerId?.toString();
        if (!playerId) {
            log("⚠️ Skipping player with no playerId:", player.name);
            continue;
        }

        const battingAvg = player.careerStats?.batting?.average || 0;
        const bowlingAvg = player.careerStats?.bowling?.average || "not specified";
        const highestScore = player.careerStats?.batting?.highest || 0;

        const text = `${player.name}, a ${player.age}-year-old ${player.role} from the ${clubTeamData.teamName}.
${player.name} is a ${player.battingStyle}, with a batting average of ${battingAvg}, a bowling average of ${bowlingAvg}, and a highest score of ${highestScore}.`;

        log("📝 Generated text for club player:", text);

        const request = {
            input: { text },
            voice: {
                languageCode: "en-IN",
                ssmlGender: "MALE",
                name: "en-IN-Wavenet-C",
            },
            audioConfig: {
                audioEncoding: "MP3",
                speakingRate: 1.0,
                pitch: 0.0,
                volumeGainDb: 0.0,
                effectsProfileId: ["handset-class-device"],
            },
        };

        try {
            const [response] = await client.synthesizeSpeech(request);
            const fileName = `club_player_audio/${playerId}.mp3`;
            const tempFilePath = path.join("/tmp", `${playerId}.mp3`);

            await util.promisify(fs.writeFile)(tempFilePath, response.audioContent, "binary");
            log("💾 Club player audio file saved locally:", tempFilePath);

            await storage.bucket().upload(tempFilePath, {
                destination: fileName,
                metadata: { contentType: "audio/mpeg" },
            });
            log("🚀 Club player audio file uploaded to Firebase Storage:", fileName);

            const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.bucket().name}/o/${encodeURIComponent(fileName)}?alt=media`;

            // Update the player's audioUrl in the clubTeams document's players array
            const updatedPlayers = players.map(p =>
                p.playerId === playerId ? { ...p, audioUrl: fileUrl } : p
            );

            await db.collection("clubTeams").doc(clubTeamId).update({
                players: updatedPlayers
            });
            log("✅ Club player audio URL updated in Firestore for player:", playerId, fileUrl);
        } catch (error) {
            log("❌ Error generating/storing club player AI voice:", error.message);
        }
    }
});

// ✅ 5. Update Club Player Audio on Stats Change
exports.updateClubPlayerDetailsAudio = onDocumentUpdated("clubTeams/{clubTeamId}", async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const clubTeamId = event.params.clubTeamId;

    const beforePlayers = before.players || [];
    const afterPlayers = after.players || [];

    log("📌 Club team updated:", clubTeamId);

    for (let i = 0; i < afterPlayers.length; i++) {
        const player = afterPlayers[i];
        const beforePlayer = beforePlayers.find(p => p.playerId === player.playerId) || {};
        const playerId = player.playerId?.toString();

        if (!playerId) {
            log("⚠️ Skipping player with no playerId:", player.name);
            continue;
        }

        // Check if relevant stats have changed
        const battingAvgBefore = beforePlayer.careerStats?.batting?.average || 0;
        const battingAvgAfter = player.careerStats?.batting?.average || 0;
        const bowlingAvgBefore = beforePlayer.careerStats?.bowling?.average || "not specified";
        const bowlingAvgAfter = player.careerStats?.bowling?.average || "not specified";
        const highestScoreBefore = beforePlayer.careerStats?.batting?.highest || 0;
        const highestScoreAfter = player.careerStats?.batting?.highest || 0;

        if (
            battingAvgBefore !== battingAvgAfter ||
            bowlingAvgBefore !== bowlingAvgAfter ||
            highestScoreBefore !== highestScoreAfter
        ) {
            log("🔄 Stats changed for player:", playerId);

            const text = `${player.name}, a ${player.age}-year-old ${player.role} from the ${after.teamName}.
${player.name} is a ${player.battingStyle}, with a batting average of ${battingAvgAfter}, a bowling average of ${bowlingAvgAfter}, and a highest score of ${highestScoreAfter}.`;

            log("📝 Generated updated text for club player:", text);

            const request = {
                input: { text },
                voice: {
                    languageCode: "en-IN",
                    ssmlGender: "MALE",
                    name: "en-IN-Wavenet-C",
                },
                audioConfig: {
                    audioEncoding: "MP3",
                    speakingRate: 1.0,
                    pitch: 0.0,
                    volumeGainDb: 0.0,
                    effectsProfileId: ["handset-class-device"],
                },
            };

            try {
                const [response] = await client.synthesizeSpeech(request);
                const fileName = `club_player_audio/${playerId}.mp3`;
                const tempFilePath = path.join("/tmp", `${playerId}.mp3`);

                await util.promisify(fs.writeFile)(tempFilePath, response.audioContent, "binary");
                log("💾 Updated club player audio file saved locally:", tempFilePath);

                await storage.bucket().upload(tempFilePath, {
                    destination: fileName,
                    metadata: { contentType: "audio/mpeg" },
                });
                log("🚀 Updated club player audio file uploaded to Firebase Storage:", fileName);

                const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.bucket().name}/o/${encodeURIComponent(fileName)}?alt=media`;

                // Update the player's audioUrl in the clubTeams document's players array
                const updatedPlayers = afterPlayers.map(p =>
                    p.playerId === playerId ? { ...p, audioUrl: fileUrl } : p
                );

                await db.collection("clubTeams").doc(clubTeamId).update({
                    players: updatedPlayers
                });
                log("✅ Updated club player audio URL in Firestore for player:", playerId, fileUrl);
            } catch (error) {
                log("❌ Error generating/storing updated club player AI voice:", error.message);
            }
        }
    }
});

// ✅ 6. Create Razorpay Order
exports.createRazorpayOrder = functions.https.onRequest(async (req, res) => {
    const { amount, planId, userId, planName, billingCycle } = req.body;

    try {
        const order = await razorpay.orders.create({
            amount, // In paise
            currency: 'INR',
            receipt: `receipt_${userId}_${Date.now()}`,
            notes: {
                userId,
                planName,
                billingCycle,
            },
        });

        res.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ 7. Verify Razorpay Payment
exports.verifyPayment = functions.https.onRequest(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        userId,
        planName,
    } = req.body;

    const secret = '6R5F7B44V1lmv3q5FS5UKLDe';

    // Signature Verification
    const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (generatedSignature === razorpay_signature) {
        // ✅ Verified – Update Firestore
        try {
            await setDoc(
                doc(getFirestore(), 'users', userId),
                { subscriptionPlan: planName },
                { merge: true }
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    } else {
        // ❌ Invalid Signature
        res.status(400).json({ success: false, error: 'Invalid signature' });
    }
});