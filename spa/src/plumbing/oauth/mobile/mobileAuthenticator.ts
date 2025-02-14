import {AxiosRequestConfig} from 'axios';
import EventBus from 'js-event-bus';
import {Guid} from 'guid-typescript';
import {Authenticator} from '../authenticator';
import {CredentialSupplier} from '../credentialSupplier';
import {EventNames} from '../../events/eventNames';
import {MobileLoginCompleteEvent} from '../../events/mobileLoginCompleteEvent';
import {MobileLogoutCompleteEvent} from '../../events/mobileLogoutCompleteEvent';
import {MobileMethodCaller} from './mobileMethodCaller';

/*
 * Used when the SPA is running in a mobile web view and getting its access tokens from the mobile app
 */
export class MobileAuthenticator implements Authenticator, CredentialSupplier {

    private readonly _methodCaller: MobileMethodCaller;
    private readonly _eventBus: EventBus;

    public constructor(eventBus: EventBus) {
        this._methodCaller = new MobileMethodCaller();
        this._eventBus = eventBus;
    }

    /*
     * Do the login operation, which in the mobile case uses an InApp browser rather than redirecting the SPA
     * Therefore the SPA needs to be told to reload data afterwards
     */
    public async login(): Promise<void> {

        await this._methodCaller.callAsync('login');
        this._eventBus.emit(EventNames.MobileLoginComplete, null, new MobileLoginCompleteEvent());
    }

    /*
     * This is a no op when the SPA is running in a mobile web view
     */
    public async handlePageLoad(): Promise<boolean> {
        return false;
    }

    /*
     * Initiate a logout redirect, which does not involve redirecting the whole page
     */
    public async logout(): Promise<void> {

        await this._methodCaller.callAsync('logout');
        this._eventBus.emit(EventNames.MobileLogoutComplete, null, new MobileLogoutCompleteEvent());
    }

    /*
     * This is a no op when the SPA is running in a mobile web view
     */
    public async onLoggedOut(): Promise<void> {
    }

    /*
     * For testing, make the access token act like it is expired
     */
    public async expireAccessToken(): Promise<void> {
        await this._methodCaller.callAsync('expireAccessToken');
    }

    /*
     * For testing, make the refresh token act like it is expired
     */
    public async expireRefreshToken(): Promise<void> {
        await this._methodCaller.callAsync('expireRefreshToken');
    }

    /*
     * When calling an API, get the mobile app's current access token, or refresh it on retries
     */
    public async onCallApi(options: AxiosRequestConfig, isRetry: boolean): Promise<void> {

        const accessToken = isRetry ?
            await this._methodCaller.callAsync('refreshAccessToken', Guid.create().toString()) :
            await this._methodCaller.callAsync('getAccessToken', Guid.create().toString());

        options.headers!.Authorization = `Bearer ${accessToken}`;
    }
}
