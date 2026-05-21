defmodule SubstrateDesignSystem.MixProject do
  use Mix.Project

  def project do
    [
      app: :substrate_design_system,
      version: "0.1.0",
      elixir: "~> 1.14",
      deps: deps(),
      description: "Design system for Substrate — icons, tokens, and components",
      package: package()
    ]
  end

  def application do
    [extra_applications: [:logger]]
  end

  defp deps do
    [{:phoenix_live_view, ">= 0.18.0"}]
  end

  defp package do
    [
      licenses: ["MIT"],
      links: %{}
    ]
  end
end
