export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      {children}
    </div>
  );
}
