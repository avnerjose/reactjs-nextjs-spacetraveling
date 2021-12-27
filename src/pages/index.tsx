import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { useState } from 'react';
import { GetStaticProps, NextPage } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { AiOutlineCalendar } from 'react-icons/ai';
import { FiUser } from 'react-icons/fi';
import { Document } from '@prismicio/client/types/documents';
import commonStyles from '../styles/common.module.scss';
import styles from '../styles/pages/home.module.scss';
import { getPrismicClient } from '../services/prismic';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

const Home: NextPage<HomeProps> = ({
  postsPagination: { next_page, results },
}) => {
  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  async function handleLoadMorePosts(): Promise<void> {
    fetch(nextPage)
      .then(res => res.json())
      .then(res => {
        setNextPage(res.next_page);
        setPosts(prev => [...prev, ...res.results]);
      });
  }

  return (
    <>
      <Head>
        <title>Home | SpaceTravelling</title>
      </Head>
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          <div className={styles.logo}>
            <Image
              src="/spacetraveling.svg"
              alt="logo"
              width="240px"
              height="26px"
            />
          </div>

          {posts.map(post => (
            <div key={post.uid} className={styles.post}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <h2>{post.data.title}</h2>
                </a>
              </Link>
              <p>{post.data.subtitle}</p>
              <div className={styles.info}>
                <div>
                  <AiOutlineCalendar />
                  <time>
                    {format(
                      new Date(post.first_publication_date),
                      'dd LLL yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </time>
                </div>
                <div>
                  <FiUser />
                  <span>{post.data.author}</span>
                </div>
              </div>
            </div>
          ))}
          {nextPage && (
            <button type="button" onClick={() => handleLoadMorePosts()}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
};

export default Home;

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const { next_page, results: res } = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['title', 'subtitle', 'author'],
      pageSize: 4,
    }
  );

  const results = res.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  return {
    props: {
      postsPagination: {
        results,
        next_page,
      },
    },
  };
};
