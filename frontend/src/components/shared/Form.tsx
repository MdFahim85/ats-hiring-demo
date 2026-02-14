import type { JSX } from "react";

const Form: React.FC<
  React.PropsWithChildren & JSX.IntrinsicElements["form"]
> = ({ children, onSubmit, ...props }) => {
  return (
    <form
      {...props}
      onSubmit={(e) => {
        e.preventDefault();
        if (onSubmit) onSubmit(e);
      }}
    >
      {children}
    </form>
  );
};

export default Form;
