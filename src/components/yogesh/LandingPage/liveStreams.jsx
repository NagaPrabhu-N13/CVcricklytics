import React from 'react';

const livestreams = () => {
  // Video data
  const videos = [
    {
      id: '02QNT9EFZyo',
      title: 'Match Highlights: GW XI vs Jaipur Strikers'
    },
    {
      id: 'fBIqzpkaIy8',
      title: 'Top 10 Tournament Moments'
    },
    {
      id: 'Uq3HQn-KsoI',
      title: 'Player Interviews'
    },
    {
      id: 't8tN72nuADM',
      title: 'Behind the Scenes'
    }
  ];

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-white">Jaipur Corporate Cricket Videos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="text-gray-200 bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow hover:shadow-yellow-500/50">
            <div className="relative pt-[56.25%]"> {/* 16:9 Aspect Ratio */}
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${video.id}`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg">{video.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default livestreams;