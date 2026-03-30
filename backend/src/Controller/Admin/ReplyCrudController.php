<?php

namespace App\Controller\Admin;

use App\Entity\Reply;
use App\Service\CensorService;
use App\Service\TweetDeleteService;
use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Context\AdminContext;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGeneratorInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;

class ReplyCrudController extends AbstractCrudController
{
    public function __construct(
        private CensorService $censorService,
        private TweetDeleteService $tweetDeleteService,
        private AdminUrlGeneratorInterface $adminUrlGenerator,
    ) {
    }

    public static function getEntityFqcn(): string
    {
        return Reply::class;
    }

    public function configureActions(Actions $actions): Actions
    {
        $censorAction = Action::new('censor', 'Censurer', 'fa fa-ban')
            ->linkToCrudAction('censorReply')
            ->addCssClass('btn btn-danger');

        $uncensorAction = Action::new('uncensor', 'Décensurer', 'fa fa-undo')
            ->linkToCrudAction('uncensorReply')
            ->addCssClass('btn btn-success');

        return $actions
            ->disable(Action::NEW, Action::EDIT)
            ->add(Crud::PAGE_INDEX, Action::DETAIL)
            ->add(Crud::PAGE_DETAIL, $censorAction)
            ->add(Crud::PAGE_DETAIL, $uncensorAction)
            ->update(Crud::PAGE_INDEX, Action::DELETE, fn (Action $action) => $action->addCssClass('btn btn-danger'))
            ->update(Crud::PAGE_DETAIL, Action::DELETE, fn (Action $action) => $action->addCssClass('btn btn-danger'));
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Réponse')
            ->setEntityLabelInPlural('Réponses')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setPageTitle('index', 'Réponses')
            ->setPageTitle('detail', 'Détail de la Réponse')
            ->setSearchFields(['content', 'author.username', 'tweet.content']);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->hideOnForm();
        yield TextareaField::new('content', 'Contenu')->setFormTypeOption('attr', ['readonly' => true]);
        yield AssociationField::new('author', 'Auteur')->setFormTypeOption('disabled', true);
        yield AssociationField::new('tweet', 'Tweet')->setFormTypeOption('disabled', true);
        yield DateTimeField::new('createdAt', 'Créé le')->hideOnForm();
        yield BooleanField::new('isCensored', 'Censuré')
            ->hideOnForm()
            ->hideOnIndex();
    }

    #[AdminRoute(path: '/censor', name: 'censor')]
    public function censorReply(AdminContext $context): RedirectResponse
    {
        $reply = $context->getEntity()->getInstance();
        $this->censorService->censorReply($reply);

        return $this->redirect(
            $this->adminUrlGenerator
                ->setController(self::class)
                ->setAction(Action::DETAIL)
                ->setEntityId($reply->getId())
                ->generateUrl()
        );
    }

    #[AdminRoute(path: '/uncensor', name: 'uncensor')]
    public function uncensorReply(AdminContext $context): RedirectResponse
    {
        $reply = $context->getEntity()->getInstance();
        $this->censorService->uncensorReply($reply, $reply->getContent());

        return $this->redirect(
            $this->adminUrlGenerator
                ->setController(self::class)
                ->setAction(Action::DETAIL)
                ->setEntityId($reply->getId())
                ->generateUrl()
        );
    }

    public function deleteEntity(\Doctrine\ORM\EntityManagerInterface $entityManager, object $entityInstance): void
    {
        if ($entityInstance instanceof Reply) {
            $this->tweetDeleteService->deleteReply($entityInstance);
        }
    }
}

