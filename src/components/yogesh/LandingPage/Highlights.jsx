import React, { useState } from "react";

const highlightsData = [
  {
    id: 1,
    image: "https://img.youtube.com/vi/gtaYTRe2Qtw/hqdefault.jpg",
    videoUrl:
      "https://www.youtube.com/embed/gtaYTRe2Qtw?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0",
  },
  {
    id: 2,
    image: "https://img.youtube.com/vi/H4-pQDMn_m4/hqdefault.jpg",
    videoUrl:
      "https://www.youtube.com/embed/H4-pQDMn_m4?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0",
  },
];

const Highlights = () => {
  const [hovered, setHovered] = useState(null);

  return (
    <section className="px-4 py-8 bg-[#0a192f] min-h-screen text-white">
      <h2 className="text-h2 lg:text-h2-lg font-bold mb-6">Highlights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {highlightsData.map((item) => (
          <div
            key={item.id}
            className="relative aspect-video rounded-lg overflow-hidden shadow-lg bg-black group cursor-pointer"
            onMouseEnter={() => setHovered(item.id)}
            onMouseLeave={() => setHovered(null)}
          >
            {hovered === item.id ? (
              <iframe
                src={item.videoUrl}
                title={`Highlight ${item.id}`}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <img
                src={item.image}
                alt={`Thumbnail ${item.id}`}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute bottom-2 right-2 z-20 bg-black/70 px-3 py-1 rounded text-caption lg:text-caption-lg text-white">
              Hover to Play
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Highlights;
