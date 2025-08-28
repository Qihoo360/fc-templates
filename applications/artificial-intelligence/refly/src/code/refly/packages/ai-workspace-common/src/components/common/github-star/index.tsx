import { Github } from 'refly-icons';
import { useEffect, useState } from 'react';
import React from 'react';

const GithubStarComponent = () => {
  const [starCount, setStarCount] = useState('4.3k');

  const handleClick = () => {
    window.open('https://github.com/refly-ai/refly', '_blank');
  };

  useEffect(() => {
    fetch('https://api.github.com/repos/refly-ai/refly')
      .then((res) => res.json())
      .then((data) => {
        const stars = data.stargazers_count;
        setStarCount(stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars.toString());
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className="flex overflow-hidden gap-0.5 justify-center items-center self-stretch px-2 py-1 my-auto text-xs font-semibold leading-none text-center whitespace-nowrap bg-refly-bg-content-z2 rounded-xl border-[1px] border-solid border-refly-Card-Border text-refly-text-0 cursor-pointer hover:bg-refly-tertiary-hover"
      onClick={handleClick}
    >
      <Github size={14} />
      <span className="leading-4 self-stretch my-auto">{starCount}</span>
    </div>
  );
};

export const GithubStar = React.memo(GithubStarComponent);

GithubStar.displayName = 'GithubStar';
