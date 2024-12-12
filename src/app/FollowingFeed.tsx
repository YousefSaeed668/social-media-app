"use client";

import InfininteScrollContainer from "@/components/InfininteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkelton";
import kyInstance from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function FollowingFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["post-feed", "following"],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(
          "/api/posts/following",
          pageParam ? { searchParams: { cursor: pageParam } } : {},
        )
        .json<PostsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
  const posts = data?.pages.flatMap((page) => page.posts) || [];
  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }
  if (status === "success" && !posts.length && !hasNextPage) {
    return (
      <p className="text-center text-muted-foreground">
        No Posts found. Start Following People to see their posts.
      </p>
    );
  }
  if (status === "error") {
    return (
      <p className="text-center text-destructive">
        An Error Occured While Loading Posts
      </p>
    );
  }

  return (
    <InfininteScrollContainer
      className="space-y-5"
      onBottomReached={() => hasNextPage && !!!isFetching && fetchNextPage()}
    >
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto mt-3 animate-spin" />}
    </InfininteScrollContainer>
  );
}
