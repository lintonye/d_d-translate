import { useQuery } from "react-query";
import { useParams } from "react-router";

type Stats = {
  viewCount: number;
  koiis: number;
};

type StatsProps = Stats;

function useArticleStats(id) {
  const result = useQuery<Stats>(["article", id], async () => {
    // TODO replace the lines below with the code that actually loads article stats
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      viewCount: 10,
      koiis: 1025,
    };
  });
  return result;
}

function Stats(props: StatsProps) {
  return (
    <div className="text-sm absolute bottom-6 right-6 bg-purple-700 p-4 text-white rounded-full shadow-xl space-y-2">
      <div className="flex justify-between w-full">
        <div>{props.viewCount} views</div>
        <div>{props.koiis} Koii earned</div>
      </div>
      <div className="text-xs">
        Alex1237, Tao
        <a className="underline border-l border-white pl-2 ml-2 cursor-pointer">
          Tip translators
        </a>
      </div>
    </div>
  );
}

export function ArticleDetail() {
  const params = useParams();
  const url = params.articleUrl as string;
  const id = url; // TODO maybe should pass the id as param instead of url
  const { data: articleStats, isLoading } = useArticleStats(id);
  return (
    <>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <iframe src={url} className="border-0 p-0 w-full h-screen" />
          <Stats {...articleStats} />
        </>
      )}
    </>
  );
}
