export const BoardFit = ({ children }) => (
  <div className="flex-1 min-h-0 w-full [container-type:size] flex items-center">
    <div className="mx-auto" style={{ width: "min(100cqw, 100cqh)", height: "min(100cqw, 100cqh)" }}>
      {children}
    </div>
  </div>
);
