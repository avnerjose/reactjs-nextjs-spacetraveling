/* eslint-disable react/no-array-index-key */
/* eslint-disable react/no-danger */
import Head from 'next/head';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AiOutlineCalendar, AiOutlineClockCircle } from 'react-icons/ai';
import { FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

const Post: NextPage<PostProps> = ({ post }) => {
  const router = useRouter();

  function calculateEstimateReadingTime(): number {
    const wordAmount = post.data.content.reduce((acc, content) => {
      let newValue = acc;
      newValue += content.heading.split(' ').length;
      newValue += RichText.asText(content.body).split(' ').length;
      return newValue;
    }, 0);

    return Math.ceil(wordAmount / 200);
  }

  if (router.isFallback) {
    return (
      <div className={commonStyles.container}>
        <Header />
        <h2>Carregando...</h2>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | SpaceTravelling</title>
      </Head>
      <Header />
      <img className={styles.banner} src={post.data.banner.url} alt="" />
      <main className={commonStyles.container}>
        <div className={styles.postHeader}>
          <h1>{post.data.title}</h1>
          <div>
            <div>
              <AiOutlineCalendar />
              <time>
                {format(new Date(post.first_publication_date), 'dd LLL yyyy', {
                  locale: ptBR,
                })}
              </time>
            </div>
            <div>
              <FiUser />
              <span>{post.data.author}</span>
            </div>
            <div>
              <AiOutlineClockCircle />
              <span>{calculateEstimateReadingTime()} min</span>
            </div>
          </div>
        </div>

        {post?.data.content.map((content, index) => {
          return (
            <div className={styles.posts} key={index}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          );
        })}
      </main>
    </>
  );
};

export default Post;

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'post'),
  ]);
  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));
  return {
    fallback: true,
    paths,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params as { slug: string };
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', slug, {});

  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return { props: { post }, revalidate: 60 * 60 * 24 };
};
