import ecommerce from "./ecommerce/content";
import foodDelivery from "./food-delivery/content";
import rideHailing from "./ride-hailing/content";
import hotelPms from "./hotel-pms/content";
import appointmentSaas from "./appointment-saas/content";
import projectManagement from "./project-management/content";
import videoStreaming from "./video-streaming/content";
import socialNetwork from "./social-network/content";
import cloudFileStorage from "./cloud-file-storage/content";
import paymentPlatform from "./payment-platform/content";

export const projects = [ecommerce, foodDelivery, rideHailing, hotelPms, appointmentSaas, projectManagement, videoStreaming, socialNetwork, cloudFileStorage, paymentPlatform];
export const projectBySlug = new Map(projects.map((project) => [project.slug, project]));
