local HTTPService = game:GetService("HttpService")

function UpdateData()
	coroutine.resume(coroutine.create(function()
		pcall(function()
			HTTPService:PostAsync("http://localhost:2043/update", HTTPService:JSONEncode({
				name = game.Name,
				gameId = game.PlaceId
			}))
		end)
	end))
end

UpdateData()

local Listener = game:GetPropertyChangedSignal("Name"):Connect(UpdateData)

plugin.Unloading:Connect(function()
	pcall(function()
		HTTPService:GetAsync("http://localhost:2043/clear")
	end)
end)