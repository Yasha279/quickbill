const LoadingSpinner = ({ fullScreen = false, size = 'md' }) => {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  const spinner = (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-2 border-brand-200 border-t-brand-600`}
    />
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        {spinner}
      </div>
    );
  }
  return <div className="flex justify-center p-8">{spinner}</div>;
};

export default LoadingSpinner;


