type ResetButtonProps = {
  onReset: () => void;
};

export default function ResetButton({ onReset }: ResetButtonProps) {
  return (
    <button
      onClick={onReset}
      className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
    >
      Reset game
    </button>
  );
}
