import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders VoltGuard dashboard heading", () => {
  render(<App />);
  const heading = screen.getByText(/VoltGuard Dashboard/i);
  expect(heading).toBeInTheDocument();
});
