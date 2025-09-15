defmodule SlackyWeb.PageController do
  use SlackyWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
