<?php

namespace App\Controller\Admin;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;

class SecurityController extends AbstractController
{
    #[Route('/admin/login', name: 'admin_login')]
    public function login(AuthenticationUtils $authenticationUtils): Response
    {
        if ($this->isGranted('ROLE_ADMIN')) {
            return $this->redirectToRoute('admin');
        }

        return $this->render('@EasyAdmin/page/login.html.twig', [
            'page_title'           => 'Administration',
            'action'               => $this->generateUrl('admin_login'),
            'csrf_token_intention' => 'authenticate',
            'username_parameter'   => '_username',
            'password_parameter'   => '_password',
            'last_username'        => $authenticationUtils->getLastUsername(),
            'error'                => $authenticationUtils->getLastAuthenticationError(),
            'target_path'          => 'admin',
        ]);
    }

    #[Route('/admin/logout', name: 'admin_logout')]
    public function logout(): void
    {
        // handled by Symfony's security system
    }
}
