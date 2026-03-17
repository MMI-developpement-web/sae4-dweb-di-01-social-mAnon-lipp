import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Register from "./routes/register";
import Login from "./routes/login";
import Feed, { loader as feedLoader } from "./routes/feed";
import Post, { loader as postLoader } from "./routes/post";
import Profile, { loader as profileLoader } from "./routes/profile";
import ErrorPage from "./routes/error";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Feed />,
    loader: feedLoader,
    errorElement: <ErrorPage />,
    HydrateFallback: () => null,
  },
  {
    path: "/feed",
    element: <Feed />,
    loader: feedLoader,
    errorElement: <ErrorPage />,
    HydrateFallback: () => null,
  },
  {
    path: "/login",
    element: <Login />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/register",
    element: <Register />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/post",
    element: <Post />,
    loader: postLoader,
    errorElement: <ErrorPage />,
    HydrateFallback: () => null,
  },
  {
    path: "/profile/:id",
    element: <Profile />,
    loader: profileLoader,
    errorElement: <ErrorPage />,
    HydrateFallback: () => null,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
