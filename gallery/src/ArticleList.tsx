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
        url: "https://y5stpgibaqkig6g23wsa4g7nhfgj2uwcvwecrfaxxvzl5vocbu.arweave.net/x2U3mQEEFIN42t2kDhvtOUydUsKtiCiUF71-yvtXCDc",
        title: "可能没有什么 #4",
        excerpt:
          "假期来临了！我们的一些公会和项目组正在为新的一年而收尾。我们的一些公会和项目组正在为新的一年收尾（包括我们的通讯组）。我们鼓励大家利用这段时间以自己的方式充电。",
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
