<?php

namespace App\Controller\Admin;

use App\Entity\Tweet;
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

class TweetCrudController extends AbstractCrudController
{
    public function __construct(
        private CensorService $censorService,
        private TweetDeleteService $tweetDeleteService,
        private AdminUrlGeneratorInterface $adminUrlGenerator,
    ) {
    }

    public static function getEntityFqcn(): string
    {
        return Tweet::class;
    }

    public function configureActions(Actions $actions): Actions
    {
        $censorAction = Action::new('censor', 'Censurer', 'fa fa-ban')
            ->linkToCrudAction('censorTweet')
            ->addCssClass('btn btn-danger');

        $uncensorAction = Action::new('uncensor', 'Décensurer', 'fa fa-undo')
            ->linkToCrudAction('uncensorTweet')
            ->addCssClass('btn btn-success');

        return $actions
            ->disable(Action::NEW, Action::EDIT)
            ->add(Crud::PAGE_INDEX, Action::DETAIL)
            ->add(Crud::PAGE_DETAIL, $censorAction)
            ->add(Crud::PAGE_DETAIL, $uncensorAction)
            ->update(Crud::PAGE_INDEX, Action::DELETE, fn (Action $action) => $action
                ->addCssClass('btn btn-danger')
                ->setHtmlAttributes(['onclick' => 'return confirm("Êtes-vous sûr ? Cette action supprimera aussi toutes les réponses associées.");'])
            )
            ->update(Crud::PAGE_DETAIL, Action::DELETE, fn (Action $action) => $action
                ->addCssClass('btn btn-danger')
                ->setHtmlAttributes(['onclick' => 'return confirm("Êtes-vous sûr ? Cette action supprimera aussi toutes les réponses associées.");'])
            );
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Tweet')
            ->setEntityLabelInPlural('Tweets')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setPageTitle('index', 'Tweets')
            ->setPageTitle('detail', 'Détail du Tweet')
            ->setSearchFields(['content', 'author.username']);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->hideOnForm();
        yield TextareaField::new('content', 'Contenu')->setFormTypeOption('attr', ['readonly' => true]);
        yield AssociationField::new('author', 'Auteur')->setFormTypeOption('disabled', true);
        yield DateTimeField::new('createdAt', 'Créé le')->hideOnForm();
        yield DateTimeField::new('updatedAt', 'Mis à jour le')->hideOnForm();
        yield BooleanField::new('isCensored', 'Censuré')
            ->hideOnForm()
            ->hideOnIndex();
    }

    #[AdminRoute(path: '/censor', name: 'censor')]
    public function censorTweet(AdminContext $context): RedirectResponse
    {
        $tweet = $context->getEntity()->getInstance();
        $this->censorService->censorTweet($tweet);

        return $this->redirect(
            $this->adminUrlGenerator
                ->setController(self::class)
                ->setAction(Action::DETAIL)
                ->setEntityId($tweet->getId())
                ->generateUrl()
        );
    }

    #[AdminRoute(path: '/uncensor', name: 'uncensor')]
    public function uncensorTweet(AdminContext $context): RedirectResponse
    {
        $tweet = $context->getEntity()->getInstance();
        $this->censorService->uncensorTweet($tweet, $tweet->getContent());

        return $this->redirect(
            $this->adminUrlGenerator
                ->setController(self::class)
                ->setAction(Action::DETAIL)
                ->setEntityId($tweet->getId())
                ->generateUrl()
        );
    }

    public function deleteEntity(\Doctrine\ORM\EntityManagerInterface $entityManager, object $entityInstance): void
    {
        if ($entityInstance instanceof Tweet) {
            $this->tweetDeleteService->deleteTweet($entityInstance);
        }
    }
}

