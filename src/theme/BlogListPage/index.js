/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect } from 'react'

import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import BlogPostItem from '@theme/BlogPostItem'
import BlogListPaginator from '@theme/BlogListPaginator'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGithub,
  faGoogle,
  faZhihu,
  faJ,
} from '@fortawesome/free-brands-svg-icons'

import JuejinIcon from '@site/static/icons/juejin.svg'

import { useTrail, animated } from 'react-spring'
// import Fade from 'react-reveal/Fade'

// import Button from '../../components/Button'
import Head from '@docusaurus/Head'
import HeroMain from './img/hero_main.svg'
import ListFilter from './img/list.svg'
import CardFilter from './img/card.svg'
import Link from '@docusaurus/Link'
import { useViewType } from './useViewType'
function BlogListPage(props) {
  const { metadata, items } = props

  const {
    siteConfig: { title: siteTitle },
  } = useDocusaurusContext()
  const isBlogOnlyMode = metadata.permalink === '/'
  const isPaginated = metadata.page > 1
  const title = isBlogOnlyMode ? siteTitle : 'Blog'
  const description = `记录一下学习和日常生活`

  // list or card view
  const { viewType, toggleViewType } = useViewType()

  const isCardView = viewType === 'card'
  const isListView = viewType === 'list'
  // animation
  const animatedTexts = useTrail(5, {
    from: { opacity: 0, transform: 'translateY(3em)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: {
      mass: 3,
      friction: 45,
      tension: 460,
    },
    // delay: 300,
  })
  // const animatedHero = useSpring({
  //   opacity: 1,
  //   backgroundPositionX: '100%',
  //   from: { opacity: 0, backgroundPositionX: '200%' },
  //   config: { mass: 3, tension: 280, friction: 30 },
  //   // delay: 1200,
  // })

  // const animatedBackground = useSpring({
  //   background: "linear-gradient(25deg, #1081ff, #72e1f6, #b185ff)",
  //   to: {
  //     background: "linear-gradient(375deg, #1081ff, #72e1f6, #b185ff)",
  //   },
  // });

  return (
    <Layout
      title={title}
      description={description}
      wrapperClassName='blog-list__page'
    >
      <Head>
        <meta
          name='keywords'
          content='前端, html, css, js, javascript, react, vue, typescript, es6, html5, css3, 性能优化, 兼容性调整'
        />
        <title>{title} - 学习&&记录</title>
      </Head>
      {/* 个人简介 */}
      {!isPaginated && (
        <animated.div className='hero'>
          <div className='bloghome__intro'>
            <animated.div style={animatedTexts[0]} className='hero_text'>
              Hello！我是<span className='intro__name'>嘉欣</span>
            </animated.div>
            <animated.p style={animatedTexts[1]}>
              记录一下学习和日常生活
            </animated.p>
            {/* <animated.p style={animatedTexts[3]}>
              QQ 1 群：644722908，2 群：1004912565
            </animated.p> */}
            <SocialLinks animatedProps={animatedTexts[4]} />
            {/* <animated.div style={animatedTexts[2]}>
              <a
                href="https://space.bilibili.com/302954484?from=search&seid=1788147379248960737"
                className="bloghome__follow"
              >
                去 B 站关注 ({(Math.round(followers) / 10000).toFixed(1)} 万)
              </a>
            </animated.div> */}
          </div>

          <HeroMainImage />
          {/* <animated.div
          className="bloghome__scroll-down"
          style={animatedBackground}
        >
          <button>
            <ArrowDown />
          </button>
        </animated.div> */}
        </animated.div>
      )}
      <div className='container-wrapper'>
        <div className='container padding-vert--sm'>
          <div className='row'>
            <div className='col col--12'>
              {/* <div className="content__divider"></div> */}
              {!isPaginated && (
                <h1 className='blog__section_title'>
                  最新博客&nbsp;
                  <svg
                    width='31'
                    height='31'
                    viewBox='0 0 31 31'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M25.8333 5.16666H5.16668C3.73293 5.16666 2.59626 6.31624 2.59626 7.74999L2.58334 23.25C2.58334 24.6837 3.73293 25.8333 5.16668 25.8333H25.8333C27.2671 25.8333 28.4167 24.6837 28.4167 23.25V7.74999C28.4167 6.31624 27.2671 5.16666 25.8333 5.16666ZM10.9792 19.375H9.42918L6.13543 14.8542V19.375H4.52084V11.625H6.13543L9.36459 16.1458V11.625H10.9792V19.375ZM17.4375 13.2525H14.2083V14.6992H17.4375V16.3267H14.2083V17.7604H17.4375V19.375H12.2708V11.625H17.4375V13.2525ZM26.4792 18.0833C26.4792 18.7937 25.8979 19.375 25.1875 19.375H20.0208C19.3104 19.375 18.7292 18.7937 18.7292 18.0833V11.625H20.3438V17.4504H21.8033V12.9037H23.4179V17.4375H24.8646V11.625H26.4792V18.0833Z'
                      fill='#4490D6'
                    />
                  </svg>
                </h1>
              )}
              {/* switch list and card */}
              <div className='bloghome__swith-view'>
                <CardFilter
                  onClick={() => toggleViewType('card')}
                  fill={viewType === 'card' ? '#006dfe' : '#CECECE'}
                />
                <ListFilter
                  onClick={() => toggleViewType('list')}
                  fill={viewType === 'list' ? '#006dfe' : '#CECECE'}
                />
              </div>
              <div className='bloghome__posts'>
                {isCardView && (
                  <div className='bloghome__posts-card'>
                    {items.map(({ content: BlogPostContent }) => (
                      // <Fade key={BlogPostContent.metadata.permalink}>
                      <BlogPostItem
                        key={BlogPostContent.metadata.permalink}
                        frontMatter={BlogPostContent.frontMatter}
                        metadata={BlogPostContent.metadata}
                        truncated={BlogPostContent.metadata.truncated}
                        // views={views.find(v => v.slug == BlogPostContent.frontMatter.slug)?.views}
                      >
                        <BlogPostContent />
                      </BlogPostItem>
                      // </Fade>
                    ))}
                  </div>
                )}

                {isListView && (
                  <div className='bloghome__posts-list'>
                    {items.map(({ content: BlogPostContent }, index) => {
                      const { metadata: blogMetaData, frontMatter } =
                        BlogPostContent
                      const { title } = frontMatter
                      const { permalink, date, tags } = blogMetaData

                      const dateObj = new Date(date)

                      const year = dateObj.getFullYear()
                      let month = ('0' + (dateObj.getMonth() + 1)).slice(-2)
                      const day = ('0' + dateObj.getDate()).slice(-2)

                      return (
                        <div
                          className='post__list-item'
                          key={blogMetaData.permalink + index}
                        >
                          <Link to={permalink} className='post__list-title'>
                            {title}
                          </Link>
                          <div className='post__list-tags'>
                            {tags.length > 0 &&
                              tags
                                .slice(0, 2)
                                .map(
                                  (
                                    { label, permalink: tagPermalink },
                                    index
                                  ) => (
                                    <Link
                                      key={tagPermalink}
                                      className={`post__tags ${
                                        index < tags.length
                                          ? 'margin-right--sm'
                                          : ''
                                      }`}
                                      to={tagPermalink}
                                      style={{
                                        fontSize: '0.75em',
                                        fontWeight: 500,
                                      }}
                                    >
                                      {label}
                                    </Link>
                                  )
                                )}
                          </div>
                          <div className='post__list-date'>
                            {year}-{month}-{day}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <BlogListPaginator metadata={metadata} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function SocialLinks({ animatedProps, ...props }) {
  // const { isDarkTheme } = useThemeContext();
  return (
    <animated.div className='social__links' style={animatedProps}>
      {/* <a href='https://space.bilibili.com/4377132'>
        <BilibiliIcon />
      </a> */}
      <a href='https://github.com/Cansiny0320'>
        <FontAwesomeIcon icon={faGithub} size='lg' />
      </a>
      <a href='https://juejin.cn/user/4371313964620712'>
        <JuejinIcon />
      </a>
      <a href='https://www.zhihu.com/people/wang-jia-xin-bu-hui-nbcs'>
        <FontAwesomeIcon icon={faZhihu} size='lg' />
      </a>
      <a href='mailto:cansiny1220@gmail.com'>
        <FontAwesomeIcon icon={faGoogle} size='lg' />
      </a>

      {/* <div className="dropdown dropdown--hoverable">
        <FontAwesomeIcon icon={faWeixin} size="lg" />
        <img
          width="50%"
          className="dropdown__menu"
          src={useBaseUrl('/img/publicQR.png')}
        />
      </div> */}
    </animated.div>
  )
}

function HeroMainImage() {
  return (
    <div className='bloghome__image'>
      <HeroMain />
    </div>
  )
}

export default BlogListPage
