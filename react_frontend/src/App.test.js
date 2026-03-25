import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Energy Consumption Dashboard heading", () => {
  render(<App />);
  const heading = screen.getByText(/Energy Consumption Dashboard/i);
  expect(heading).toBeInTheDocument();
});
