import { google } from "googleapis";
import oAuth2Client from "../config/googleClient.js";

export const googleAuth = (req, res) => {
  const scopes = ["https://www.googleapis.com/auth/calendar"];
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
  res.redirect(url);
};

export const googleAuthCallback = async (req, res) => {
  try {
    const code = req.query.code;
    const { tokens } = await oAuth2Client.getToken(code);
    console.log("Tokens received:", tokens);
    res.send("Auth successful! Copy your refresh token from console.");
  } catch (error) {
    console.error("Error in Google auth callback:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createMeet = async (req, res) => {
  try {
    const { summary, description, startTime, endTime, attendees } = req.body;

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const event = {
      summary: summary || "New Meeting",
      description: description || "Google Meet via API",
      start: {
        dateTime: startTime || new Date().toISOString(),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime:
          endTime ||
          new Date(new Date().getTime() + 30 * 60000).toISOString(),
        timeZone: "Asia/Kolkata",
      },
      conferenceData: {
        createRequest: {
          requestId: "meet-" + Date.now(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      attendees: attendees || [],
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });

    return res.status(200).json({
      success: true,
      meetLink: response.data.hangoutLink,
      eventId: response.data.id,
    });
  } catch (error) {
    console.error("Error creating meet:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
