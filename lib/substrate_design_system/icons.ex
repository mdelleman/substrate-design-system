defmodule SubstrateDesignSystem.Icons do
  use Phoenix.Component

  @icons_priv Path.expand(Path.join([__DIR__, "..", "..", "priv", "icons"]))
  @icon_sizes [16, 20, 24, 32, 48]

  Module.register_attribute(__MODULE__, :_svg_viewbox, accumulate: false)
  Module.register_attribute(__MODULE__, :_svg_inner, accumulate: false)

  for size <- @icon_sizes,
      dir <- [@icons_priv |> Path.join(to_string(size))],
      File.dir?(dir),
      file_path <- Path.wildcard(Path.join(dir, "*.svg")) do
    @external_resource file_path

    raw = File.read!(file_path)

    vb =
      case Regex.run(~r/viewBox="([^"]+)"/, raw) do
        [_, v] -> v
        _ -> "0 0 #{size} #{size}"
      end

    inner =
      raw
      |> String.replace(~r/^.*?<svg[^>]*>/s, "")
      |> String.replace(~r/<\/svg>\s*$/s, "")
      |> String.trim()

    @_svg_viewbox vb
    @_svg_inner inner

    fn_name =
      file_path
      |> Path.basename(".svg")
      |> String.replace("-", "_")
      |> String.to_atom()

    attr :class, :string, default: nil
    attr :rest, :global

    def unquote(fn_name)(assigns) do
      assigns = assign(assigns, _viewbox: @_svg_viewbox, _inner: @_svg_inner)

      ~H"""
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={@_viewbox} class={@class} {@rest}>
        <%= {:safe, @_inner} %>
      </svg>
      """
    end
  end
end
