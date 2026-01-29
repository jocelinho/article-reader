import type { Metadata } from "next";
import { ArticleReader } from "@/components/ArticleReader";

export const metadata: Metadata = {
  title: "Article Reader",
  description: "A beautiful, distraction-free article reading experience",
};

export default function ReadPage() {
  return <ArticleReader />;
}
