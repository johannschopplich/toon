// import "./App.css";

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
]);

function App() {
  return (
    <div className="min-h-screen bg-b text-foreground">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
