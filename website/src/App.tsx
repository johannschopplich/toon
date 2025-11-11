import "./App.css";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Docs from "./pages/docs";
import Home from "./pages/home";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/docs",
    element: <Docs />,
  },
])

function App() {

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
