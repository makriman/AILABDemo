import Button from '../common/Button';
import Input from '../common/Input';

export default function LoginForm({ values, errors, loading, onChange, onSubmit }) {
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
        autoComplete="current-password"
      />
      <Button type="submit" loading={loading}>
        Log in
      </Button>
    </form>
  );
}
