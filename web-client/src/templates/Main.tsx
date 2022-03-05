import { ReactNode } from 'react';

type IMainProps = {
  meta: ReactNode;
  children: ReactNode;
};

const Main = (props: IMainProps) => (
  <div className="antialiased w-full text-gray-700 px-1">
    {props.meta}

    <div className="max-w-screen-md mx-auto">
      <h1 className="border-b border-gray-300 font-black font-mono">
        {'🕹 Central Control 🕹'}
      </h1>

      <div className="py-5 text-xl content">{props.children}</div>

      <div className="border-t border-gray-300 text-center py-8 text-sm font-mono">
        <span role="img" aria-label="rocketpower">
          🚀 Blastoff
        </span>
      </div>
    </div>
  </div>
);

export { Main };
