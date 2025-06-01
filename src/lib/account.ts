import type { SyncResponse, SyncUpdatedResponse, EmailAddress } from "@/types";

import axios from "axios";
export class Account {
  private readonly accessToken: string;

  constructor(token: string) {
    this.accessToken = token;
  }

  private startSync = async () => {
    try {
      const response = await axios.post<SyncResponse>(
        `https://api.aurinko.io/v1/email/sync`,
        null,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          params: {
            daysWithin: 1,
            bodyType: "html",
          },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error starting a new email sync: ",
          error.response?.data,
        );
      }
      console.error(
        "Unexpected error while starting a new email sync: ",
        error,
      );
      throw error;
    }
  };
  private getUpdatedEmails = async (
    deltaToken: string | null = null,
    pageToken: string | null = null,
  ) => {
    try {
      const response = await axios.get(
        `https://api.aurinko.io/v1/email/sync/updated`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          params: {
            deltaToken,
            pageToken,
          },
        },
      );
      return response.data as SyncUpdatedResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching email list: ", error.response?.data);
      }
      console.error("Unexpected error while fetching email list: ", error);
      throw error;
    }
  };

  public performInitialSync = async () => {
    try {
      let syncResponse = await this.startSync();
      while (!syncResponse.ready) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        syncResponse = await this.startSync();
      }
      let storedDeltaToken = syncResponse.syncUpdatedToken;
      let syncData = await this.getUpdatedEmails(storedDeltaToken, null);
      storedDeltaToken = syncData.nextDeltaToken;
      let emailRecords = syncData.records;

      // fetch all email records
      while (syncData.nextPageToken) {
        syncData = await this.getUpdatedEmails(null, syncData.nextPageToken);
        storedDeltaToken = syncData.nextDeltaToken;
        emailRecords = [...emailRecords, ...syncData.records];
      }

      console.log(
        `Initial sync completed. We hav synced, ${emailRecords.length} emails`,
      );

      return { emails: emailRecords, deltaToken: storedDeltaToken };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error performing initial sync: ",
          JSON.stringify(error.response?.data, null, 2),
        );
      } else {
        console.error(
          "Unexpected error while performing initial sync: ",
          error,
        );
      }
    }
  };

  async sendEmail({
    from,
    subject,
    body,
    inReplyTo,
    references,
    threadId,
    to,
    cc,
    bcc,
    replyTo,
  }: {
    from: EmailAddress;
    subject: string;
    body: string;
    inReplyTo?: string;
    references?: string;
    threadId?: string;
    to: EmailAddress[];
    cc?: EmailAddress[];
    bcc?: EmailAddress[];
    replyTo?: EmailAddress;
  }) {
    try {
      const response = await axios.post(
        `${process.env.AURINKO_API_BASE_URL}/v1/email/messages`,
        {
          from,
          subject,
          body,
          inReplyTo,
          references,
          threadId,
          to,
          cc,
          bcc,
          replyTo: [replyTo],
        },
        {
          params: {
            bodyType: "html",
            returnIds: true,
          },
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      console.log("Email sent successfully", response.data);
      return response.data as {
        id: string;
        threadId: string;
        status: "Ok";
        processingStatus: "Ok" | "Incomplete";
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios Error sending email:", JSON.stringify(error));
      } else {
        console.error("Error sending email:", error);
      }
      throw error;
    }
  }

  /**
   * Get email and deltaToken
   */
  async getEmailDeltaToken(token: string) {
    let storedDeltaToken = token;
    let syncData = await this.getUpdatedEmails(storedDeltaToken, null);
    storedDeltaToken = syncData.nextDeltaToken;
    let emailRecords = syncData.records;

    // fetch all email records
    while (syncData.nextPageToken) {
      syncData = await this.getUpdatedEmails(null, syncData.nextPageToken);
      storedDeltaToken = syncData.nextDeltaToken;
      emailRecords = [...emailRecords, ...syncData.records];
    }

    console.log(
      `Initial sync completed. We hav synced, ${emailRecords.length} emails`,
    );

    return { emails: emailRecords, deltaToken: storedDeltaToken };
  }
}
