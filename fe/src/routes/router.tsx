import { BrowserRouter, Route, Routes } from "react-router";

import { HomePage } from "@/pages/home-page";

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export { AppRouter };
