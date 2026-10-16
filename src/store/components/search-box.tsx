import { SearchIcon } from "./icons";

/** Plain GET form: works without JavaScript and keeps the words in the URL. */
export function SearchBox({ defaultValue = "", className = "" }: { defaultValue?: string; className?: string }) {
  return (
    <form action="/search" method="get" role="search" className={`flex w-full ${className}`}>
      <label htmlFor="q" className="sr-only">
        ابحث عن منتج
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="بتدوّر على إيه؟ مثلاً: صينية"
        className="min-h-[52px] w-full min-w-0 rounded-s-2xl border-2 border-e-0 border-line bg-white px-4 text-[18px] focus:border-blue focus:outline-none"
        enterKeyHint="search"
      />
      <button type="submit" className="inline-flex min-h-[52px] items-center gap-2 rounded-e-2xl bg-navy px-4 font-bold text-white hover:bg-navy-2">
        <SearchIcon size={24} />
        <span className="hidden md:inline">بحث</span>
      </button>
    </form>
  );
}
