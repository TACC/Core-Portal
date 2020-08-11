import {
  createNotificationsSocket,
  socketEmitter,
} from "../notifications.sagas";
import { eventChannel } from "redux-saga";
import { WebSocket } from "mock-socket";
import ReconnectingWebSocket from "reconnecting-websocket";

global.WebSocket = WebSocket;
jest.mock("reconnecting-websocket");
test("Create Notification Socket function", () => {
  global.window = Object.create(window);
  const url = "https://google.com";
  Object.defineProperty(window, "location", {
    value: new URL(url),
  });
  createNotificationsSocket();
  expect(ReconnectingWebSocket).toHaveBeenCalled();
  expect(ReconnectingWebSocket).toHaveBeenCalledWith(
    `wss://google.com/ws/notifications/`
  );
});

jest.mock("redux-saga");
test("Socket Emitter", () => {
  const fakeSocket = new WebSocket('wss://Hello-World');
  socketEmitter(fakeSocket);
  expect(eventChannel).toHaveBeenCalled();
  expect(eventChannel).toHaveBeenCalledWith(expect.any(Function));
});

describe("Effect Creators", () => {
  test.todo("Watch Socket");
  test.todo("Watch Fetch Notifications");
});

describe("Sagas", () => {
  it.todo("should handle sockets")
  it.todo("fetch notifications");
  it.todo("read notifications");
  it.todo("delete notifications");
})
