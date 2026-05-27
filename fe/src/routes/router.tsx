import { BrowserRouter, Route, Routes } from "react-router";

import { AccountsPage, HomePage, RecurringCostsPage } from "@/pages/home-page";

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/recurring-costs" element={<RecurringCostsPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export { AppRouter };
