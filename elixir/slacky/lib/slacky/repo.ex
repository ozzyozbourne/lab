defmodule Slacky.Repo do
  use Ecto.Repo,
    otp_app: :slacky,
    adapter: Ecto.Adapters.Postgres
end
