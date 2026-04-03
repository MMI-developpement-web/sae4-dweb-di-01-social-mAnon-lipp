<?php

namespace App\Controller\Admin;

use App\Entity\Retweet;
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
use Doctrine\ORM\EntityManagerInterface;

class RetweetCrudController extends AbstractCrudController
{
    public function __construct(
        private AdminUrlGeneratorInterface $adminUrlGenerator,
        private EntityManagerInterface $entityManager,
    ) {
    }

    public static function getEntityFqcn(): string
    {
        return Retweet::class;
    }

    public function configureActions(Actions $actions): Actions
    {
        $censorAction = Action::new('censor', 'Censurer', 'fa fa-ban')
            ->linkToCrudAction('censorRetweet')
            ->addCssClass('btn btn-danger')
            ->displayIf(static function ($entity) {
                return !$entity->isCensored();
            });

        $uncensorAction = Action::new('uncensor', 'Décensurer', 'fa fa-undo')
            ->linkToCrudAction('uncensorRetweet')
            ->addCssClass('btn btn-success')
            ->displayIf(static function ($entity) {
                return $entity->isCensored();
            });

        return $actions
            ->disable(Action::NEW, Action::EDIT)
            ->add(Crud::PAGE_INDEX, Action::DETAIL)
            ->add(Crud::PAGE_DETAIL, $censorAction)
            ->add(Crud::PAGE_DETAIL, $uncensorAction)
            ->update(Crud::PAGE_INDEX, Action::DELETE, fn (Action $action) => $action
                ->addCssClass('btn btn-danger')
                ->setHtmlAttributes(['onclick' => 'return confirm("Êtes-vous sûr ?");'])
            )
            ->update(Crud::PAGE_DETAIL, Action::DELETE, fn (Action $action) => $action
                ->addCssClass('btn btn-danger')
                ->setHtmlAttributes(['onclick' => 'return confirm("Êtes-vous sûr ?");'])
            );
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Retweet')
            ->setEntityLabelInPlural('Retweets')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setPageTitle('index', 'Retweets')
            ->setPageTitle('detail', 'Détail du Retweet')
            ->setHelp('index', '⚠️ <strong>Censure automatique:</strong> Quand vous censurez un tweet, <strong>tous ses retweets sont automatiquement censurés</strong> par le système. Les retweets affichés ici reflètent l\'état actuel. <strong>Exemple:</strong> Si vous censurez le tweet #42, tous ses retweets seront marqués comme censurés.');
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->hideOnForm();
        yield TextareaField::new('content', 'Contenu')->setFormTypeOption('attr', ['readonly' => true]);
        yield AssociationField::new('author', 'Auteur')->setFormTypeOption('disabled', true);
        yield AssociationField::new('originalTweet', 'Tweet original')->setFormTypeOption('disabled', true);
        yield DateTimeField::new('createdAt', 'Créé le')->hideOnForm();
        yield BooleanField::new('isCensored', 'Censuré')
            ->hideOnForm()
            ->hideOnIndex();
    }

    #[AdminRoute(path: '/censor', name: 'censor')]
    public function censorRetweet(AdminContext $context): RedirectResponse
    {
        $retweet = $context->getEntity()->getInstance();
        $retweet->setIsCensored(true);
        $this->entityManager->flush();

        return $this->redirect(
            $this->adminUrlGenerator
                ->setController(self::class)
                ->setAction(Action::DETAIL)
                ->setEntityId($retweet->getId())
                ->generateUrl()
        );
    }

    #[AdminRoute(path: '/uncensor', name: 'uncensor')]
    public function uncensorRetweet(AdminContext $context): RedirectResponse
    {
        $retweet = $context->getEntity()->getInstance();
        $retweet->setIsCensored(false);
        $this->entityManager->flush();

        return $this->redirect(
            $this->adminUrlGenerator
                ->setController(self::class)
                ->setAction(Action::DETAIL)
                ->setEntityId($retweet->getId())
                ->generateUrl()
        );
    }
}
