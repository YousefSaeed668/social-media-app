"use client";

import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import { SearchIcon } from "lucide-react";

export default function SearchField() {
  const router = useRouter();
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.q as HTMLInputElement).value.trim();
    if (!q) return;
    // encodeURIComponent because there is a chance that the search query contains special characters
    // that has meaning in the URL, like `?`, `&`, `=`, etc.
    // this way we can escape those characters and make sure the URL is valid.
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }
  return (
    // we do the action like this because if the javascript still not loaded,
    // the form will still work and this called progressive enhancement
    <form onSubmit={handleSubmit} method="GET" action={"/search"}>
      <div className="relative">
        <Input placeholder="Search" className="pe-10" name="q" />
        <SearchIcon className="absolute right-3 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground" />
      </div>
    </form>
  );
}
