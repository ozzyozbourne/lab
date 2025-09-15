defmodule Slacky.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      SlackyWeb.Telemetry,
      Slacky.Repo,
      {DNSCluster, query: Application.get_env(:slacky, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Slacky.PubSub},
      # Start a worker by calling: Slacky.Worker.start_link(arg)
      # {Slacky.Worker, arg},
      # Start to serve requests, typically the last entry
      SlackyWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Slacky.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    SlackyWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
