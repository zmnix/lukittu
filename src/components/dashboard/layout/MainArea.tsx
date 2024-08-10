interface MainAreaProps {
  children: React.ReactNode;
}

export default function MainArea({ children }: MainAreaProps) {
  return (
    <main className="transition-[margin-left] duration-300 ease-in-out">
      {children}
    </main>
  );
}
