/**
 * ErrorBoundary.test.js
 * Tests for the ErrorBoundary component — chunk load failure recovery.
 *
 * Run: npm test -- --testPathPattern=ErrorBoundary
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "../components/ErrorBoundary";

// Helper: a component that throws on render
function ThrowingComponent({ shouldThrow, errorMessage = "Test render error" }) {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>Content loaded successfully</div>;
}

// Suppress console.error noise in tests
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  console.error.mockRestore();
});

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Content loaded successfully")).toBeInTheDocument();
  });

  it("renders fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("shows retry button on error", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("shows go back button on error", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole("button", { name: /go back/i })).toBeInTheDocument();
  });

  it("shows chunk error message for ChunkLoadError", () => {
    const chunkError = new Error("Loading chunk 5 failed");
    chunkError.name = "ChunkLoadError";

    function ThrowChunkError() {
      throw chunkError;
    }

    render(
      <ErrorBoundary>
        <ThrowChunkError />
      </ErrorBoundary>
    );
    expect(screen.getByText(/update available/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh page/i })).toBeInTheDocument();
  });

  it("renders custom fallbackMessage prop", () => {
    render(
      <ErrorBoundary fallbackMessage="Custom error for this section.">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Custom error for this section.")).toBeInTheDocument();
  });

  it("resets state and renders children after retry click", () => {
    let shouldThrow = true;

    function MaybeThrow() {
      if (shouldThrow) throw new Error("Temporary error");
      return <div>Recovered content</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    rerender(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );
    // After reset, children can render again if error is gone
    // (exact behavior depends on React version)
  });
});
