type BlinderCardProps = {
  ticker: string;
  donateValue: number[] | string;
  donateRedirectUrl?: string;
};

export const BlinderCard = ({
  ticker = "SOL",
  donateValue = [1, 5, 10],
}: BlinderCardProps) => {
  return (
    <div className="flex flex-col p-6 border-2 rounded-xl border-cyan-800 height-auto bg-stone-900">
      <div className="w-[400px] mb-4 rounded-xl">
        <img src="https://picsum.photos/500/300" alt="Placeholder image" />
      </div>
      <div className="flex flex-row items-center">
        <span className="mr-2">
          <img src="https://picsum.photos/16" alt="url logo" />
        </span>
        <a href="https://adamik.io/" className="text-slate-600 text-sm">
          https://adamik.io
        </a>
      </div>
      <div className="font-semibold text-md tracking-tight">
        Donate to Adamik
      </div>
      <div className="text-sm font-thin tracking-wide">
        The easiest way to scale blockchain integration
      </div>
      <div className="flex justify-between gap-3">
        {typeof donateValue === "string" ? (
          <>
            <button className="w-full py-2 mt-4 text-sm font-semibold uppercase text-white bg-blue-600  hover:bg-blue-500 rounded-3xl">
              {donateValue}
            </button>
          </>
        ) : (
          donateValue.map((value, i) => {
            return (
              <button
                key={`${value}_${i}`}
                className="w-full py-2 mt-4 text-sm font-semibold uppercase text-white bg-blue-600  hover:bg-blue-500 rounded-3xl"
              >
                {value} {ticker}
              </button>
            );
          })
        )}
      </div>
      <div className="relative mt-3">
        <input
          type="text"
          className="h-14 w-full pl-4 pr-10 rounded-3xl border-slate-500/40 border-[1px] bg-stone-900 focus:border-blue-600  focus:outline-none "
          placeholder={`Enter a custom ${ticker} amount`}
        />
        <div className="absolute top-2 right-2">
          <button
            disabled
            className="h-10 w-24 text-white rounded-3xl bg-blue-600 hover:bg-blue-500 disabled:bg-stone-800 disabled:text-stone-500"
          >
            Donate
          </button>
        </div>
      </div>
    </div>
  );
};
