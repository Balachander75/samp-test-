import { LoginPage, LoginPageProps } from "@/components/ui/sign-in-page";

export type SignInPageProps = LoginPageProps;

export function SignInPage(props: SignInPageProps) {
  return <LoginPage {...props} />;
}

