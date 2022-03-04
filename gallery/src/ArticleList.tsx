import { useQuery } from "react-query";
import { Link } from "react-router-dom";

type Article = {
  title: string;
  excerpt?: string;
  url: string;
};

type ThumbnailProps = Article;

function ArticleThumbnail({ title, excerpt, url }: ThumbnailProps) {
  return (
    <article className="border border-gray-200 rounded-md p-4 hover:shadow-md">
      <Link to={`/articles/${encodeURIComponent(url)}`}>
        <div>{title}</div>
        <p>{excerpt}</p>
      </Link>
    </article>
  );
}

function useArticles() {
  const result = useQuery<Article[]>("articles", async () => {
    // TODO load list of articles from AR and delete the lines below
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return [
      {
        id: "link1",
        url: "https://xw2n7w5ggqzxyy5c2e6vo6uztrvztuxm6ir4x23bqgtxitgsdebq.arweave.net/vbTf26Y0M3xjotE9V3qZnGuZ0uzyI8vrYYGndEzSGQM",
        title: "#13 Probably Nothing zh",
        excerpt:
          '在我们接近第一季的时候还有很多事情要做，从发行$CODE，到重新开放会员资格，再到会议的旅行赞助。像往常一样，"可能没有什么 "团队在这里为您提供最新的信息。',
      },
      {
        id: "link2",
        url: "https://xxvs2n5xzv2tytesjsi3kjqew5bslg4eqj2atj7i5jsmmwtwlyoq.arweave.net/vestN7fNdTxMkkyRtSYEt0Mlm4SCdAmn6Opkxlp2Xh0",
        title: "How To Upload Data To Arweave: A Permaweb Primer For Beginners",
        excerpt:
          "We often see Arweave initiates ask about the best way to upload data to the permaweb. The value proposition of pay once, store forever is universally appealing, but there’s no one  path forward.",
      },
    ];
  });
  return result;
}

export function ArticleList() {
  const { data: articles, isLoading } = useArticles();
  return (
    <div className="p-2">
      <header>
        <h1 className="text-xl font-bold my-6">Translated articles</h1>
      </header>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ul className="grid grid-cols-5 gap-4">
          {articles.map((article) => (
            <ArticleThumbnail {...article} key={article.url} />
          ))}
        </ul>
      )}
    </div>
  );
}
