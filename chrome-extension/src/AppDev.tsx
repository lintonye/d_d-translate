import TranslateOverlay from "./components/TranslateOverlay";
import "./content-scripts/main.css";

export default function AppDev() {
  return (
    <>
      <div className="translate-overlay">
        <TranslateOverlay />
      </div>
      <div className="dark:bg-gray-800 dark:text-gray-50 h-full flex flex-col justify-center items-center gap-4 px-8 bg-yellow-200 py-20 lg:gap-10">
        <h1 className="text-5xl font-extrabold text-center">Unicorn Academy</h1>
        <h2 className="text-xl lg:text-2xl text-center max-w-xl">
          An open community where designers and developers learn from each other
          and grow together
        </h2>
        {Array(30)
          .fill(0)
          .map((_, i) => (
            <p key={i}>Line {i}</p>
          ))}
        <button
          className="dark:border-gray-50 dark:hover:border-blue-200 dark:hover:text-blue-200
          hover:border-blue-500 hover:text-blue-500 border-gray-600 px-8 py-3 border-2 font-bold rounded-md text-lg"
        >
          <a href="https://discord.gg/ndZVE8HCd5">Discord</a>
        </button>
      </div>
    </>
  );
}
