import React, { useState } from 'react';
import Frame1321317519 from './Frame';

const Winner = () => {
  const [activeCategory, setActiveCategory] = useState('Popularity');

  const categories = ['Popularity', 'Batting', 'Bowling', 'Fielding', 'All Rounder'];

  // Sample data with multiple winners per category
  const winnerData = [
    // Popularity Winners
    {
      category: 'Popularity',
      name: 'Virat Kohli',
      votes: 10000,
      location: 'India',
      stats: { age: 36, inns: 500, runs: 26000, avg: 54.1, sr: 138 },
      image: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcT0DK7G4StXbLGO8OR8K6dvQu-mRsBOgyqpRe0GFuXHQ6O_5VcCBY0qN5gAEP0UpFxgJg3mG_e7OLfUaBrImOaU_t5mINZrpH6Ad-fSyRI',
    },
    {
      category: 'Popularity',
      name: 'Babar Azam',
      votes: 7600,
      location: 'Pakistan',
      stats: { age: 30, inns: 290, runs: 12000, avg: 49.5, sr: 128 },
      image: 'https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcRiZCzaE9grJSAGjyOnVWCRq4e17VEgWz4Jw2vTy-cbyGIqhA3EaI4m8YVNFXUhNTwc3gWYs-_ZLOMTvs4',
    },
  
    // Batting Winners
    {
      category: 'Batting',
      name: 'Joe Root',
      votes: 8900,
      location: 'England',
      stats: { age: 34, inns: 400, runs: 19000, avg: 50.2, sr: 87 },
      image: 'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcT39RonN6avGmMhvZ1MizK1R7wEOrJed4LqSw1RrkJlIhzMr9I-o8oFvE3xIEhbFFEK4zKOu-i2H3TtVMRUd3-mf5dR4MpjPjPBZ7WVcFbOsz-1md7_YQuCalu-YZE6cMTkkOZJUoHFZQ',
    },
    {
      category: 'Batting',
      name: 'Steve Smith',
      votes: 7700,
      location: 'Australia',
      stats: { age: 35, inns: 380, runs: 18000, avg: 51.7, sr: 90 },
      image: 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRQhuWEDW86PF4SBVgqNnQgvBJJocwcgDvgrs3n8Yel_0zkI7cLkKPBgV3-M1OfxoeNmNpLSU733hA38r7RbwRP1qyDxm3P5nAmv3zbQsY',
    },
    {
      category: 'Batting',
      name: 'Kane Williamson',
      votes: 7600,
      location: 'New Zealand',
      stats: { age: 34, inns: 360, runs: 17000, avg: 52.3, sr: 87 },
      image: 'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcRhoyG49jtPWM3fcjPYy1blKrLA9V3PHgPrJv1TujYPavJegduUXlbFEYc4Nzl5GPBrJL_16ICeHzPZhUs',
    },
    {
        category: 'Batting',
        name: 'Rassie van der Dussen',
        votes: 7300,
        location: 'South Africa',
        stats: { age: 35, inns: 190, runs: 7000, avg: 48.3, sr: 92 },
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTONPjgFAV7BdF5nXj4-cVisGzLE-wjSDevqw&s',
      },
      {
        category: 'Batting',
        name: 'Shubman Gill',
        votes: 7200,
        location: 'India',
        stats: { age: 25, inns: 130, runs: 5800, avg: 50.5, sr: 104 },
        image: 'path/to/shubman-gill.jpg',
      },
  
    // Bowling Winners
    {
      category: 'Bowling',
      name: 'Pat Cummins',
      votes: 7800,
      location: 'Australia',
      stats: { age: 31, inns: 180, wickets: 340, avg: 23.5, econ: 3.9 },
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQeoWbSnaFXZNWWC8eTrap_AkK3UP0uf0_U1AWpbmDcu9nFX7javEKWPJqiXWVhaHP6bQh7LG55uTdA0mFjOtMAKw',
    },
    {
      category: 'Bowling',
      name: 'Kagiso Rabada',
      votes: 7500,
      location: 'South Africa',
      stats: { age: 29, inns: 170, wickets: 320, avg: 24.8, econ: 4.1 },
      image: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTGVSYeQu_OKtZ-g0BLTf62uFwLGfVvCvxECUCjN3xOciYApKTDPU_LQXgzLvciOcF_Yi8TF-9sXz_8K9-nRb-j0wCo2R7Ym-x9s4Y63A',
    },
    {
      category: 'Bowling',
      name: 'Trent Boult',
      votes: 7400,
      location: 'New Zealand',
      stats: { age: 35, inns: 190, wickets: 330, avg: 25.2, econ: 4.3 },
      image: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTcQosiE0AOIl4RccPa7T6APAxVQJFIVYcvYO4p9FrmehzmAQkOIvNIMKmGpMNd2pWH58Pn6zYozIsOn28nWYVJmKNkF0WOGA0AFnGVlw',
    },
  
    // Fielding Winners
    {
      category: 'Fielding',
      name: 'David Warner',
      votes: 8200,
      location: 'Australia',
      stats: { age: 38, matches: 330, catches: 170, runOuts: 28 },
      image: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/DAVID_WARNER_%2811704782453%29.jpg',
    },
    {
      category: 'Fielding',
      name: 'Faf du Plessis',
      votes: 8100,
      location: 'South Africa',
      stats: { age: 40, matches: 300, catches: 160, runOuts: 26 },
      image: 'https://documents.iplt20.com/ipl/IPLHeadshot2025/94.png',
    },
    {
      category: 'Fielding',
      name: 'Ben Stokes',
      votes: 7900,
      location: 'England',
      stats: { age: 34, matches: 320, catches: 150, runOuts: 30 },
      image: 'https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/649c/live/78ca56d0-10ca-11f0-83b1-1fd3218c6da4.jpg.webp',
    },
    {
        category: 'Fielding',
        name: 'Glenn Maxwell',
        votes: 7700,
        location: 'Australia',
        stats: { age: 36, matches: 300, catches: 145, runOuts: 32 },
        image: 'https://static-files.cricket-australia.pulselive.com/headshots/288/591-camedia.png',
      },
      {
        category: 'Fielding',
        name: 'Hardik Pandya',
        votes: 7600,
        location: 'India',
        stats: { age: 31, matches: 240, catches: 138, runOuts: 29 },
        image: 'path/to/hardik-pandya.jpg',
      },
  
    // All Rounder Winner
    {
      category: 'All Rounder',
      name: 'Shakib Al Hasan',
      votes: 7700,
      location: 'Bangladesh',
      stats: { age: 37, inns: 390, runs: 14000, wickets: 300, avg: 41.3, sr: 94 },
      image: 'https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcQk_UwCAHoXmUFDvsgEj_S44wt51d46Z0LGEbKtIAFTGd3ZaMi3XapvoNyyeZlatQ1p2gqyjt2e2AkrQDJZs2_pKrY_IDAjnvO1IIoVo2JoxT_KBXy2Z_Xo0a-dcGeMJfXwdUhvjCz3IA',
    },
    {
      category: 'All Rounder',
      name: 'Ravindra Jadeja',
      votes: 7500,
      location: 'India',
      stats: { age: 36, inns: 370, runs: 9500, wickets: 270, avg: 45.1, sr: 101 },
      image: 'https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcSn11KHsKGmx9SWOEQtYto_ciPvEpj-8QAV3hL3fRtsCMmLQ9Vz-V5E7ROTKeaRxGoxwM4gNZczqZ0_7TU',
    },
    {
      category: 'All Rounder',
      name: 'Marcus Stoinis',
      votes: 7200,
      location: 'Australia',
      stats: { age: 35, inns: 290, runs: 7800, wickets: 150, avg: 39.7, sr: 106 },
      image: 'https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/712b/live/a70d3600-e467-11ef-b734-a507e28e4d9e.jpg.webp',
    },
  ];

  // Get top 3 players per category
  const limitedWinnerData = categories.reduce((acc, category) => {
    const categoryWinners = winnerData
      .filter(winner => winner.category === category)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3);
    return [...acc, ...categoryWinners];
  }, []);

  // Get top 3 players overall based on votes for Popularity
  const topThreeOverall = [...limitedWinnerData]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 3);

  // Filter winners based on active category
  let filteredWinners = [];

  if (activeCategory === 'Popularity') {
    // For Popularity category, show top 3 overall players
    filteredWinners = topThreeOverall;
  } else {
    // For other categories, show their top 3 players regardless of overlap with Popularity
    filteredWinners = limitedWinnerData
      .filter(winner => winner.category === activeCategory)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3);
  }
  
  const styles = {
  winnerContainer1: {
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(180deg, rgba(13, 23, 30, 1) 0%, rgba(40, 63, 121, 1) 100%)',
  },
  cricklyticsLogo1: {
    width: '25rem',  // 64px
    height: 'auto',
  },
  jamInfo1: {
    width: '4rem',  // 16px
    height: '4rem', // 16px
  },
  winnerContent1: {
    paddingLeft: '2.5rem',  // 10px
    paddingRight: '2.5rem', // 10px
    // paddingTop: '1.5rem',   // 6px
    paddingBottom: '1.5rem',// 6px
  },
  pageTitle1: {
    color: 'white',
    fontSize: '3rem',   // 5xl
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '2rem',  // 8px
    animation: 'fade-in 0.8s ease-out forwards',
  },
  categoryTabs1: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',  // 4px
    marginBottom: '2.5rem', // 10px
  },
  tabButton1: {
    paddingLeft: '1.5rem',  // 6px
    paddingRight: '1.5rem', // 6px
    paddingTop: '0.5rem',   // 2px
    paddingBottom: '0.5rem',// 2px
    borderRadius: '9999px',  // rounded-full
    color: 'white',
    fontSize: '1.125rem',  // lg
    fontWeight: 600,  // font-semibold
    transition: 'all 0.3s ease',
    background: '#142136',
  },
  tabButtonHover1: {
    background: '#2563eb',  // bg-blue-600
    transform: 'scale(1.05)',
  },
  tabButtonActive1: {
    background: '#ec4899',  // bg-pink-500
    color: 'white',
    transform: 'scale(1.1)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
  winnerCards1: {
    display: 'grid', // switch to CSS grid
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    maxWidth: '72rem',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  
  winnerCard1: {
    backgroundColor: '#142136',
    borderRadius: '0.75rem',  // rounded-xl
    overflow: 'hidden',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    // transition: 'transform 0.1s ease',
    // animation: 'slide-up 0.1s ease-out forwards',
  },
  winnerCardHover1: {
    // transform: 'scale(0.05)',
    boxShadow: '0 15px 25px -5px rgba(0, 0, 0, 0.2)',
  },
  cardHeader1: {
    backgroundColor: '#2563eb',  // bg-blue-600
    color: 'white',
    fontSize: '1.25rem',  // xl
    fontWeight: 600,  // font-semibold
    padding: '1rem',  // 4px
    textAlign: 'center',
  },
  cardContent1: {
    padding: '1.5rem',  // 6px
    color: 'white',
  },
  playerImage1: {
    width: '8rem',  // 32px
    height: '8rem',  // 32px
    borderRadius: '9999px',  // rounded-full
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: '1rem',  // 4px
    objectFit: 'cover',
    border: '2px solid red',
  },
  playerName1: {
    fontSize: '1.5rem',  // 2xl
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '0.5rem',  // 2px
  },
  playerVotes1: {
    fontSize: '1.125rem',  // lg
    textAlign: 'center',
    marginBottom: '0.5rem',  // 2px
  },
  playerLocation1: {
    fontSize: '1.125rem',  // lg
    textAlign: 'center',
    marginBottom: '1rem',  // 2px
  },
  statsTable1: {
    width: '100%',
    textAlign: 'left',
    fontSize: '0.875rem',  // sm
  },
  statsTableTd1: {
    paddingTop: '0.25rem',  // 1px
    paddingBottom: '0.25rem',  // 1px
  },
  statsTableFirstChild1: {
    fontWeight: 600,  // font-semibold
    paddingRight: '1rem',  // 4px
  },
  winnerBanner1: {
    backgroundColor: '#fbbf24',  // bg-yellow-400
    color: 'black',
    textAlign: 'center',
    paddingTop: '0.5rem',  // 2px
    paddingBottom: '0.5rem',  // 2px
    fontWeight: 'bold',
    fontSize: '1.125rem',  // lg
  },
};

// Usage example in JSX
// <div style={styles.winnerContainer}>...</div>


return (
  <div style={styles.winnerContainer1}>
    <div style={styles.winnerContent1}>
      <h1 style={styles.pageTitle1}>Winners of 2022</h1>
      

      {/* Category Tabs */}
      <div style={styles.categoryTabs1}>
      <Frame1321317519 />
        {categories.map((category) => (
          <button
            key={category}
            style={{
              ...styles.tabButton1,
              ...(activeCategory === category ? styles.tabButtonActive1 : {}),
            }}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Winner Cards */}
      <div style={styles.winnerCards1}>
        {filteredWinners.map((winner, index) => (
          <div
            key={index}
            style={styles.winnerCard1}
            className="transition-transform duration-200 hover:scale-105"
          >
            <div style={styles.cardHeader1}>
              {activeCategory === 'Popularity' ? 'Popularity' : winner.category}
            </div>
            <div style={styles.cardContent1}>
              <img src={winner.image} alt={winner.name} style={styles.playerImage1} />
              <h2 style={styles.playerName1}>{winner.name}</h2>
              {activeCategory === 'Popularity' && (
                <p style={styles.playerVotes1}>{winner.votes} Votes</p>
              )}
              <p style={styles.playerLocation1}>{winner.location}</p>
              <table style={styles.statsTable1}>
                <tbody>
                  <tr>
                    <td style={styles.statsTableFirstChild1}>Age:</td>
                    <td>{winner.stats.age}</td>
                  </tr>
                  <tr>
                    <td style={styles.statsTableFirstChild1}>Inns:</td>
                    <td>{winner.stats.inns}</td>
                  </tr>
                  {winner.category === 'Batting' || winner.category === 'All Rounder' || (activeCategory === 'Popularity' && winner.stats.runs) ? (
                    <>
                      <tr>
                        <td style={styles.statsTableFirstChild1}>Runs:</td>
                        <td>{winner.stats.runs}</td>
                      </tr>
                      <tr>
                        <td style={styles.statsTableFirstChild1}>Avg:</td>
                        <td>{winner.stats.avg}</td>
                      </tr>
                      <tr>
                        <td style={styles.statsTableFirstChild1}>SR:</td>
                        <td>{winner.stats.sr}</td>
                      </tr>
                    </>
                  ) : null}
                  {winner.category === 'Bowling' || winner.category === 'All Rounder' ? (
                    <>
                      <tr>
                        <td style={styles.statsTableFirstChild1}>Wickets:</td>
                        <td>{winner.stats.wickets}</td>
                      </tr>
                      <tr>
                        <td style={styles.statsTableFirstChild1}>Avg:</td>
                        <td>{winner.stats.avg}</td>
                      </tr>
                      <tr>
                        <td style={styles.statsTableFirstChild1}>Econ:</td>
                        <td>{winner.stats.econ}</td>
                      </tr>
                    </>
                  ) : null}
                  {winner.category === 'Fielding' ? (
                    <>
                      <tr>
                        <td style={styles.statsTableFirstChild1}>Matches:</td>
                        <td>{winner.stats.matches}</td>
                      </tr>
                      <tr>
                        <td style={styles.statsTableFirstChild1}>Catches:</td>
                        <td>{winner.stats.catches}</td>
                      </tr>
                      <tr>
                        <td style={styles.statsTableFirstChild1}>Run Outs:</td>
                        <td>{winner.stats.runOuts}</td>
                      </tr>
                    </>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div style={styles.winnerBanner1}>WINNER</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
};

export default Winner;