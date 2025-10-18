import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ReactPaginate from "react-paginate";

import Heading from "../ui/Heading";
import Row from "../ui/Row";
import Posts from "../ui/Posts";
import Spinner from "../ui/Spinner";
import AIChatbot from "../ui/AIChatbot";

import "./Pagination.css";

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [like, setLike] = useState(false);
  const [save, setSaved] = useState(false);
  const [likedPostsSet, setLikedPostsSet] = useState(new Set());
  const [savedPostsSet, setSavedPostsSet] = useState(new Set());
  const [pageNumber, setPageNumber] = useState(0);
  const postsPerPage = 5;

  const auth = JSON.parse(localStorage.getItem("user"));
  const userID = auth?.id || auth?._id;

  // Fetch liked/saved post IDs
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(
          `https://server.livelymoss-d77e8dd3.westus2.azurecontainerapps.io/user/getUserDetails/like/save?userID=${userID}`,
          {
            headers: {
              "Content-Type": "application/json",
              authorization: `bearer ${JSON.parse(localStorage.getItem("token"))}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const userData = await response.json();

        setLikedPostsSet(new Set(userData.likedPostIds));
        setSavedPostsSet(new Set(userData.savedPostIds));
        localStorage.setItem("userData", JSON.stringify(userData));
      } catch (error) {
        console.error("Error fetching user details:", error.message);
      }
    };

    fetchUserDetails();
  }, [like, save]);

  const handleLike = () => setLike((prev) => !prev);
  const handleSave = () => setSaved((prev) => !prev);

  // Fetch all club posts
  useEffect(() => {
    const fetchData = async () => {
      try {
  const response = await fetch("https://server.livelymoss-d77e8dd3.westus2.azurecontainerapps.io/user/clubPosts", {
          headers: {
            "Content-Type": "application/json",
            authorization: `bearer ${JSON.parse(localStorage.getItem("token"))}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const pageCount = Math.ceil(data.length / postsPerPage);
  const changePage = ({ selected }) => {
    setPageNumber(selected);
  };

  if (loading) return <Spinner />;
  if (error) return <p>Error: {error}</p>;

  return (
    <>
      <Row type="horizontal">
        <Heading as="h1">Dashboard</Heading>
      </Row>

      <Row type="vertical">
        {data
          .slice(pageNumber * postsPerPage, (pageNumber + 1) * postsPerPage)
          .map((post) => (
            <Posts
              key={post._id}
              id={post._id}
              title={post.title}
              description={post.description}
              coordinators={post.coordinators}
              clubName={post.clubName}
              image={post.image || null}
              setHandleLike={handleLike}
              setHandleSave={handleSave}
              likeByUser={likedPostsSet.has(post._id)}
              saveByUser={savedPostsSet.has(post._id)}
            />
          ))}
      </Row>

      <PaginationWrapper>
        <PaginationContainer>
          <ReactPaginate
            nextLabel="next >"
            onPageChange={changePage}
            pageCount={pageCount}
            previousLabel="< previous"
            pageClassName="page-item"
            pageLinkClassName="page-link"
            previousClassName="page-item"
            previousLinkClassName="page-link"
            nextClassName="page-item"
            nextLinkClassName="page-link"
            breakLabel="..."
            breakClassName="page-item"
            breakLinkClassName="page-link"
            containerClassName="pagination"
            activeClassName="active"
            renderOnZeroPageCount={null}
          />
        </PaginationContainer>
      </PaginationWrapper>
      
      <AIChatbot />
    </>
  );
}

export default Dashboard;
