import { SearchIcon } from "./icons";

/** Plain GET form: works without JavaScript and keeps the words in the URL. */
export function SearchBox({ defaultValue = "", className = "" }: { defaultValue?: string; className?: string }) {
  return (
    <form
      action="/search"
      method="get"
      role="search"
      className={`flex w-full items-center rounded-full border-2 border-transparent bg-soft focus-within:border-blue focus-within:bg-white ${className}`}
    >
      <label htmlFor="q" className="sr-only">
        ابحث عن منتج
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="اكتب اسم المنتج اللي بتدوّر عليه"
        className="min-h-[50px] w-full min-w-0 rounded-full bg-transparent ps-5 text-[17px] placeholder:text-muted focus:outline-none"
        enterKeyHint="search"
      />
      <button
        type="submit"
        className="me-1 inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 font-bold text-navy hover:bg-sky-2"
      >
        <SearchIcon size={24} />
        <span>بحث</span>
      </button>
    </form>
  );
}
