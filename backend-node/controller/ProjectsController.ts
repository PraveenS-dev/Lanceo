import Projects, { ProjectDetails } from "../model/Projects";
import ProjectsAttachments, { ProjectAttachment } from "../model/ProjectsAttachments";
import { Request, Response } from "express";


const List = async (req: Request, res: Response) => {
    try {

        return res.status(200).json({ data: "" });

    } catch (err: any) {
        return res.status(500).json({ message: err });
    }
}

const Store = async (req: Request, res: Response) => {

}

const Edit = async (req: Request, res: Response) => {

}

const GetData = async (req: Request, res: Response) => {

}

const GetAttachments = async (req: Request, res: Response) => {

}

const Delete = async (req: Request, res: Response) => {

}