import Button from "./components/ui/Button";

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-[var(--color-background)]">
      <h1 className="text-5xl font-bold text-[var(--color-text)]">
        PantryPal
      </h1>

      <Button>
        Get Started
      </Button>
    </div>
  );
}

export default App;