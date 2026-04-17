import Button from '../common/Button';
import Input from '../common/Input';

export default function SignupForm({ values, errors, loading, onChange, onSubmit }) {
  return (
    <form className="form" onSubmit={onSubmit}>
      <Input
        id="username"
        label="Username"
        value={values.username}
        onChange={(event) => onChange('username', event.target.value)}
        error={errors.username}
        autoComplete="username"
      />
      <Input
        id="password"
        label="Password"
        type="password"
        value={values.password}
        onChange={(event) => onChange('password', event.target.value)}
        error={errors.password}
        autoComplete="new-password"
      />
      <Input
        id="securityQuestion"
        label="Security Question"
        value={values.securityQuestion}
        onChange={(event) => onChange('securityQuestion', event.target.value)}
        error={errors.securityQuestion}
      />
      <Input
        id="securityAnswer"
        label="Security Answer"
        value={values.securityAnswer}
        onChange={(event) => onChange('securityAnswer', event.target.value)}
        error={errors.securityAnswer}
      />
      <Button type="submit" loading={loading}>
        Create account
      </Button>
    </form>
  );
}
